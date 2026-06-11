using Lab7.Dtos;
using Lab7.Models;
using Lab7.Repositories;
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

    public QuizzesController(IQuizRepository repo) => _repo = repo;

    [HttpGet]
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
        var quiz = await _repo.AddQuestionAsync(id, dto.Text);
        return quiz is null ? NotFound() : Ok(quiz);
    }
}
