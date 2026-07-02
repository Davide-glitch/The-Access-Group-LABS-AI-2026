using Lab7.Dtos;
using Lab7.Models;
using Lab7.Repositories;
using Lab7.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Identity.Web;

namespace Lab7.Controllers;

[ApiController]
[Route("quizzes")]
[Authorize]
public class QuizzesController : ControllerBase
{
    private readonly IQuizRepository _repo;
    private readonly IQuizGenerator _generator;

    public QuizzesController(IQuizRepository repo, IQuizGenerator generator)
    {
        _repo = repo;
        _generator = generator;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<Quiz>>> List() =>
        Ok(await _repo.AllAsync());

    [HttpGet("{id:guid}", Name = nameof(GetById))]
    public async Task<ActionResult<Quiz>> GetById(Guid id)
    {
        var quiz = await _repo.FindAsync(id);
        return quiz is null ? NotFound() : Ok(quiz);
    }

    [HttpPost]
    public async Task<ActionResult<Quiz>> Create(CreateQuizDto dto)
    {
        var ownerId = User.GetObjectId()!;
        var quiz = await _repo.AddAsync(dto.Title, dto.Description, ownerId);
        return CreatedAtAction(
            nameof(GetById),
            new { id = quiz.Id },
            quiz);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Replace(Guid id, UpdateQuizDto dto)
    {
        var quiz = await _repo.FindAsync(id);
        if (quiz is null) return NotFound();

        if (quiz.OwnerId != User.GetObjectId()) return Forbid();

        await _repo.UpdateAsync(id, dto.Title, dto.Description);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var quiz = await _repo.FindAsync(id);
        if (quiz is null) return NotFound();

        if (quiz.OwnerId != User.GetObjectId()) return Forbid();

        await _repo.RemoveAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/questions")]
    public async Task<ActionResult<Quiz>> AddQuestion(Guid id, CreateQuestionDto dto)
    {
        if (dto.Options.Count != 0)
        {
            if (dto.Options.Count < 2)
                return BadRequest("A question needs at least two answer options, or none at all.");
            if (dto.Options.Count(o => o.IsCorrect) != 1)
                return BadRequest("Exactly one answer option must be marked as correct.");
        }

        var options = dto.Options.Select(o => (o.Text, o.IsCorrect)).ToList();
        var quiz = await _repo.AddQuestionAsync(id, dto.Text, options);
        return quiz is null ? NotFound() : Ok(quiz);
    }

    [HttpPost("generate")]
    public async Task<ActionResult<Quiz>> Generate(GenerateQuizDto dto)
    {
        var ownerId = User.GetObjectId()!;
        var title = string.IsNullOrWhiteSpace(dto.Title)
            ? $"Generated quiz — {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC"
            : dto.Title!;

        var existingQuizzes = await _repo.AllAsync();
        if (existingQuizzes.Any(q => q.Title.Equals(title, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest($"A quiz with the title '{title}' already exists. Please choose a different topic.");
        }

        GeneratedQuizPayload generated;
        try
        {
            generated = await _generator.GenerateAsync(dto.SourceText, dto.QuestionCount);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, ex.Message);
        }

        var quiz = await _repo.AddAsync(title, description: "Generated from source text by QuizGenerator.", ownerId);

        foreach (var q in generated.Questions)
        {
            var options = q.Options.Select(o => (o.Text, o.IsCorrect)).ToList();
            await _repo.AddQuestionAsync(quiz.Id, q.Text, options);
        }

        var withQuestions = await _repo.FindAsync(quiz.Id);
        return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, withQuestions);
    }

    [HttpGet("{id:guid}/play")]
    [AllowAnonymous]
    public async Task<ActionResult<PlayQuizDto>> GetForPlay(Guid id)
    {
        var quiz = await _repo.FindAsync(id);
        if (quiz is null) return NotFound();

        return Ok(new PlayQuizDto
        {
            Id = quiz.Id,
            Title = quiz.Title,
            Description = quiz.Description,
            Questions = quiz.Questions.Select(q => new PlayQuestionDto
            {
                Id = q.Id,
                Text = q.Text,
                Options = q.Options.Select(o => new PlayOptionDto { Id = o.Id, Text = o.Text }).ToList()
            }).ToList()
        });
    }

    [HttpPost("{id:guid}/evaluate")]
    [AllowAnonymous]
    public async Task<ActionResult<QuizResultDto>> Evaluate(Guid id, SubmitQuizDto dto)
    {
        var quiz = await _repo.FindAsync(id);
        if (quiz is null) return NotFound();

        var gradableQuestions = quiz.Questions.Where(q => q.Options.Count > 0).ToList();

        var results = new List<QuestionResultDto>();
        foreach (var q in gradableQuestions)
        {
            var correctOption = q.Options.First(o => o.IsCorrect);
            var submitted = dto.Answers.FirstOrDefault(a => a.QuestionId == q.Id);

            results.Add(new QuestionResultDto
            {
                QuestionId = q.Id,
                QuestionText = q.Text,
                SelectedOptionId = submitted?.SelectedOptionId,
                CorrectOptionId = correctOption.Id,
                WasCorrect = submitted is not null && submitted.SelectedOptionId == correctOption.Id,
                Options = q.Options.Select(o => new ResultOptionDto
                {
                    Id = o.Id,
                    Text = o.Text,
                    IsCorrect = o.IsCorrect
                }).ToList()
            });
        }

        var correctCount = results.Count(r => r.WasCorrect);

        return Ok(new QuizResultDto
        {
            TotalQuestions = results.Count,
            CorrectCount = correctCount,
            ScorePercentage = results.Count == 0 ? 0 : Math.Round(100.0 * correctCount / results.Count, 1),
            Results = results
        });
    }
}