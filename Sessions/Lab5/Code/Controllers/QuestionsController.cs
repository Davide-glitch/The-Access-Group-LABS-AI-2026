using Lab5.Dtos;
using Lab5.Models;
using Lab5.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Lab5.Controllers;

[ApiController]
[Route("quizzes/{quizId:guid}/questions")]
public class QuestionsController : ControllerBase
{
    private readonly IQuestionRepository _questionRepo;
    private readonly IQuizRepository _quizRepo;

    public QuestionsController(IQuestionRepository questionRepo, IQuizRepository quizRepo)
    {
        _questionRepo = questionRepo;
        _quizRepo = quizRepo;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Question>> List(Guid quizId)
    {
        if (_quizRepo.Find(quizId) == null) return NotFound("Quiz not found.");
        return Ok(_questionRepo.GetByQuizId(quizId));
    }

    [HttpGet("{id:guid}", Name = "GetQuestionById")]
    public ActionResult<Question> GetById(Guid quizId, Guid id)
    {
        var question = _questionRepo.Find(id);
        if (question == null || question.QuizId != quizId) return NotFound();
        return Ok(question);
    }

    [HttpPost]
    public ActionResult<Question> Create(Guid quizId, CreateQuestionDto dto)
    {
        if (_quizRepo.Find(quizId) == null) return NotFound("Quiz not found.");

        var question = _questionRepo.Add(quizId, dto.Text, dto.CorrectAnswer);

        return CreatedAtRoute("GetQuestionById", new { quizId = quizId, id = question.Id }, question);
    }

    [HttpPut("{id:guid}")]
    public IActionResult Replace(Guid quizId, Guid id, UpdateQuestionDto dto)
    {
        var question = _questionRepo.Find(id);
        if (question == null || question.QuizId != quizId) return NotFound();

        var updated = _questionRepo.Update(id, dto.Text, dto.CorrectAnswer);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid quizId, Guid id)
    {
        var question = _questionRepo.Find(id);
        if (question == null || question.QuizId != quizId) return NotFound();

        var removed = _questionRepo.Remove(id);
        return removed ? NoContent() : NotFound();
    }
}