using Lab7.Data;
using Lab7.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// The scope string needed for OAuth
const string scope = "api://5c2ab77a-5cfb-4b0e-aa3c-327f600296e6/access_as_user";


builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173")
     .AllowAnyHeader().AllowAnyMethod())).AddSwaggerGen(options =>
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

// Validate Microsoft-issued bearer tokens using the AzureAd config.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

var connectionString = builder.Configuration.GetConnectionString("QuizzesDb");
builder.Services.AddDbContext<QuizzesDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IQuizRepository, EfQuizRepository>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.OAuthClientId("5c2ab77a-5cfb-4b0e-aa3c-327f600296e6");
        options.OAuthUsePkce(); // Proof-key flow, no client secret needed
        options.OAuthScopeSeparator(" ");
    });
}


app.UseCors();

// Order matters: Authentication before Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

//11111111-1111-1111-1111-111111111111