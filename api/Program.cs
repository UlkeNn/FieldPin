using FieldPin.Api.Infrastructure.Options;
using FieldPin.Api.Infrastructure.Persistence;
using FieldPin.Api.Infrastructure.Services;
using FieldPin.Api.Infrastructure.Services.Customers;
using FieldPin.Api.Infrastructure.Services.ServiceRequests;
using FieldPin.Api.Infrastructure.Services.Technicians;
using FieldPin.Api.Infrastructure.Services.WorkOrders;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FieldPin.Api.Infrastructure;

DotNetEnv.Env.Load();


var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.Converters.Add(new FieldPin.Api.Infrastructure.UtcDateTimeConverter());
    });

builder.Services.AddEndpointsApiExplorer(); // API uç noktalarını keşfetmek için gerekli
builder.Services.AddSwaggerGen(c =>         // Swagger üreticisi (ISwaggerProvider)
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "FieldPin API", Version = "v1" }));


// Sqlite
var sqliteConn = builder.Configuration.GetConnectionString("Sqlite")
    ?? throw new InvalidOperationException("ConnectionStrings:Sqlite missing");

builder.Services.AddDbContext<AppDbContext>(opt =>
{
    opt.UseSqlite(sqliteConn);
});


// ── AUTH ─────────────────────────────────────────────────
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
var jwt = builder.Configuration.GetSection("Jwt");
var jwtKey = jwt["Key"] ?? throw new InvalidOperationException("Jwt:Key missing in appsettings.json");

builder.Services
  .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(opt =>
  {
      opt.TokenValidationParameters = new TokenValidationParameters
      {
          ValidateIssuer = true,
          ValidateAudience = true,
          ValidateLifetime = true,
          ValidateIssuerSigningKey = true,
          ValidIssuer = jwt["Issuer"],
          ValidAudience = jwt["Audience"],
          IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
          ClockSkew = TimeSpan.FromSeconds(30)
      };
  });

builder.Services.AddAuthorization();

builder.Services.AddScoped<DbSeeder>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<Microsoft.AspNetCore.Identity.IPasswordHasher<FieldPin.Api.Models.AppUser>,
                           Microsoft.AspNetCore.Identity.PasswordHasher<FieldPin.Api.Models.AppUser>>();

// ── SERVICES ────────────────────────────────────────────
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<ITechnicianService, TechnicianService>();
builder.Services.AddScoped<IWorkOrderService, WorkOrderService>();
builder.Services.AddScoped<IUserAvatarService, UserAvatarService>();
builder.Services.AddScoped<IServiceRequestService, ServiceRequestService>();

// ── ANPR (Plaka Tanıma) ─────────────────────────────────
builder.Services.Configure<FieldPin.Api.Infrastructure.Options.PlateRecognitionOptions>(
    builder.Configuration.GetSection(FieldPin.Api.Infrastructure.Options.PlateRecognitionOptions.SectionName));
builder.Services.AddHttpClient<
    FieldPin.Api.Infrastructure.Services.Anpr.IPlateRecognitionService,
    FieldPin.Api.Infrastructure.Services.Anpr.PlateRecognizerService>();

// CORS
var corsOrigins = builder.Configuration.GetSection("AllowedCorsOrigins").Get<string[]>()
    ?? Array.Empty<string>();

builder.Services.AddCors(opt =>
{
    opt.AddPolicy("admin-web", p =>
        p.WithOrigins(corsOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()   // ← Cookie gönderimi için gerekli
    );
});


var app = builder.Build();

//Request.Scheme https olsun istiyoruz
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor 
                    | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// uploads serve: /uploads/...
var uploadsRoot = Path.Combine(app.Environment.ContentRootPath, "storage", "uploads");
Directory.CreateDirectory(uploadsRoot);

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsRoot),
    RequestPath = "/uploads"
});


// Seed
// SQLite klasörü kendisi oluşturmaz; temiz kurulumda App_Data yoksa açılışta hata verir.
var sqliteDir = Path.GetDirectoryName(new Microsoft.Data.Sqlite.SqliteConnectionStringBuilder(sqliteConn).DataSource);
if (!string.IsNullOrEmpty(sqliteDir))
    Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, sqliteDir));

using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
    await seeder.SeedAsync();
}

app.UseCors("admin-web");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
