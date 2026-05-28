using Lab5.Models;

namespace Lab5.Repositories;

public interface IQuestionRepository
{
    IEnumerable<Question> GetByQuizId(Guid quizId);
    Question? Find(Guid id);
    Question Add(Guid quizId, string text, string correctAnswer);
    bool Update(Guid id, string text, string correctAnswer);
    bool Remove(Guid id);
    void RemoveAllByQuizId(Guid quizId);
}