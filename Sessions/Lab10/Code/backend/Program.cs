using Lab7.Data;
using Lab7.Repositories;
using Lab7.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

const string clientId = "642452f4-96d5-49e6-bc37-d949807fa47d";
const string scope = $"api://{clientId}/access_as_user";

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("oauth2", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            AuthorizationCode = new OpenApiOAuthFlow
            {
                AuthorizationUrl = new Uri("https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize"),
                TokenUrl = new Uri("https://login.microsoftonline.com/consumers/oauth2/v2.0/token"),
                Scopes = new Dictionary<string, string> { { scope, "Access the Quizzes API as you" } }
            }
        }
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "oauth2" }
            },
            new[] { scope }
        }
    });
});

var connectionString = builder.Configuration.GetConnectionString("QuizzesDb");
builder.Services.AddDbContext<QuizzesDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IQuizRepository, EfQuizRepository>();
builder.Services.AddScoped<IQuizGenerator, OpenAiQuizGenerator>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.OAuthClientId(clientId);
        options.OAuthUsePkce();
        options.OAuthScopeSeparator(" ");
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();