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

    // NEW for Lab 8 — temporarily public so the React app can list quizzes
    // before we've wired up a browser sign-in flow (that's a later session).
    // Every other action below still requires [Authorize] from the class
    // attribute: writes are exactly as protected as they were in Lab 7.
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
        var ownerId = User.GetObjectId()!;  // the oid claim — guaranteed present, the route is [Authorize]d
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
        // NEW for Lab 9 — a question's options are optional (back-compat with
        // Lab 8 text-only questions), but if any are supplied they must form
        // a gradable set: 2+ options, exactly one correct. Never trust a
        // client-submitted "this one is right" without this check — and
        // never trust it again at evaluation time either (see Evaluate()).
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

    // NEW for Lab 9 — hand a longer piece of text to the quiz generator and
    // persist whatever it comes back with as a brand-new quiz. A write, so
    // it stays [Authorize]d like Create/AddQuestion above.
    [HttpPost("generate")]
    public async Task<ActionResult<Quiz>> Generate(GenerateQuizDto dto)
    {
        var ownerId = User.GetObjectId()!;

        GeneratedQuizPayload generated;
        try
        {
            generated = await _generator.GenerateAsync(dto.SourceText, dto.QuestionCount);
        }
        catch (InvalidOperationException ex)
        {
            // The model misbehaved (bad shape, malformed question, etc.) —
            // that's our server trusting an upstream model, not a bad request
            // from the caller, so it comes back as a 502, not a 400.
            return StatusCode(StatusCodes.Status502BadGateway, ex.Message);
        }

        var title = string.IsNullOrWhiteSpace(dto.Title)
            ? $"Generated quiz — {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC"
            : dto.Title!;

        var quiz = await _repo.AddAsync(title, description: "Generated from source text by QuizGenerator.", ownerId);

        foreach (var q in generated.Questions)
        {
            var options = q.Options.Select(o => (o.Text, o.IsCorrect)).ToList();
            await _repo.AddQuestionAsync(quiz.Id, q.Text, options);
        }

        var withQuestions = await _repo.FindAsync(quiz.Id);
        return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, withQuestions);
    }

    // NEW for Lab 9 — the "play" shape of a quiz: questions and options,
    // never IsCorrect. Reading is public this lab (same as List()), so the
    // browser can fetch a quiz to play without a sign-in flow.
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

    // NEW for Lab 9 — server-side grading. The client sends back which
    // option it picked per question; the server (not the browser) decides
    // what's correct, because the browser already saw a version of this
    // quiz with no correct answers marked. AllowAnonymous for the same
    // reason GetForPlay is: grading is a read/compute, not a write.
    [HttpPost("{id:guid}/evaluate")]
    [AllowAnonymous]
    public async Task<ActionResult<QuizResultDto>> Evaluate(Guid id, SubmitQuizDto dto)
    {
        var quiz = await _repo.FindAsync(id);
        if (quiz is null) return NotFound();

        // Only grade questions that actually have answer options — a
        // Lab 8-style text-only question has nothing to be "correct", so it
        // doesn't count toward the score either way.
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
