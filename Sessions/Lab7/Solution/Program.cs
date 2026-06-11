using Lab7.Data;
using Lab7.Repositories;
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

app.UseAuthentication();   // 1. who are you?   (reads + validates the token)
app.UseAuthorization();    // 2. are you allowed? (enforces [Authorize])

app.MapControllers();

app.Run();
