using Lab7.Data;
using Lab7.Repositories;
using Lab7.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

const string clientId = "5c2ab77a-5cfb-4b0e-aa3c-327f600296e6";
const string scope = $"api://{clientId}/access_as_user";

// 1. Register services into the DI container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// NEW for Lab 8 — let the Vite dev server (a different origin) call this API.
// The browser enforces CORS, not the server, so without this every fetch()
// from localhost:5173 fails before it even reaches a controller.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Swagger, taught to run the Microsoft sign-in flow so we can get a token without a front-end.
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

// EF Core + SQL Server, reading the connection string from appsettings.json.
var connectionString = builder.Configuration.GetConnectionString("QuizzesDb");
builder.Services.AddDbContext<QuizzesDbContext>(options =>
    options.UseSqlServer(connectionString));

// The whole app talks to the IQuizRepository abstraction — never the concrete type.
builder.Services.AddScoped<IQuizRepository, EfQuizRepository>();

// NEW for Lab 9 — the quiz generator. Singleton: it holds no per-request
// state, just a configured chat client, so there's no need to build a
// fresh one for every request (unlike the EF Core repository above, which
// is Scoped because DbContext isn't thread-safe to share).
builder.Services.AddSingleton<IQuizGenerator, OpenAiQuizGenerator>();

// Authentication: validate Microsoft-issued bearer tokens using the AzureAd config.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

var app = builder.Build();

// 2. Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.OAuthClientId(clientId);
        options.OAuthUsePkce();           // proof-key flow — no client secret needed
        options.OAuthScopeSeparator(" ");
    });
}

// NEW for Lab 8 — must run before UseAuthorization, same reasoning as
// authentication-before-authorization: decide who may even talk to us
// before deciding what they're allowed to do.
app.UseCors();

app.UseAuthentication();   // 1. who are you?   (reads + validates the token)
app.UseAuthorization();    // 2. are you allowed? (enforces [Authorize])

app.MapControllers();

app.Run();
