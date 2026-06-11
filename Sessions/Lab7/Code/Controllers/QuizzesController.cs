using Lab7.Dtos;
using Lab7.Models;
using Lab7.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;

namespace Lab7.Controllers;

[ApiController]
[Route("quizzes")]
[Authorize] // This ensures every action requires a valid token
public class QuizzesController : ControllerBase
{
    private readonly IQuizRepository _repo;

    public QuizzesController(IQuizRepository repo)
    {
        _repo = repo;
    }

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
        // 1. Get the stable user ID from the validated token (who is calling?)
        var ownerId = User.GetObjectId()!;

        // 2. Pass the ownerId down to the repository to stamp it on the new quiz
        var quiz = await _repo.AddAsync(dto.Title, dto.Description, ownerId);

        return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, quiz);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Replace(Guid id, UpdateQuizDto dto)
    {
        // 1. Load the quiz first
        var quiz = await _repo.FindAsync(id);
        if (quiz is null) return NotFound();

        // 2. Check ownership: return 403 Forbidden if they don't match
        if (quiz.OwnerId != User.GetObjectId()) return Forbid();

        // 3. If we get here, they are the owner, so proceed with the update
        var updated = await _repo.UpdateAsync(id, dto.Title, dto.Description);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // 1. Load the quiz first
        var quiz = await _repo.FindAsync(id);
        if (quiz is null) return NotFound();

        // 2. Check ownership: return 403 Forbidden if they don't match
        if (quiz.OwnerId != User.GetObjectId()) return Forbid();

        // 3. If we get here, they are the owner, so proceed with the deletion
        await _repo.RemoveAsync(id);
        return NoContent();
    }
}