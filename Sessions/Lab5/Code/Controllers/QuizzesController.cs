using Lab5.Dtos;
using Lab5.Models;
using Lab5.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Lab5.Controllers;

[ApiController]
[Route("quizzes")]
public class QuizzesController : ControllerBase
{
    private readonly IQuizRepository _quizRepo;
    private readonly IQuestionRepository _questionRepo;

    public QuizzesController(IQuizRepository quizRepo, IQuestionRepository questionRepo)
    {
        _quizRepo = quizRepo;
        _questionRepo = questionRepo;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Quiz>> List()
    {
        return Ok(_quizRepo.All());
    }

    [HttpGet("{id:guid}", Name = nameof(GetQuizById))]
    public ActionResult<Quiz> GetQuizById(Guid id)
    {
        var quiz = _quizRepo.Find(id);
        return quiz is null ? NotFound() : Ok(quiz);
    }

    [HttpPost]
    public ActionResult<Quiz> Create(CreateQuizDto dto)
    {
        var quiz = _quizRepo.Add(dto.Title, dto.Description);

        return CreatedAtAction(
            nameof(GetQuizById),
            new { id = quiz.Id },
            quiz);
    }

    [HttpPut("{id:guid}")]
    public IActionResult Replace(Guid id, UpdateQuizDto dto)
    {
        var updated = _quizRepo.Update(id, dto.Title, dto.Description);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        // Cascade delete: first remove all associated questions
        _questionRepo.RemoveAllByQuizId(id);

        // Then remove the quiz itself
        var removed = _quizRepo.Remove(id);
        return removed ? NoContent() : NotFound();
    }
}