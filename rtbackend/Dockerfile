FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY ["rtbackend.csproj", "./"]
RUN dotnet restore

COPY . .

RUN dotnet build -c Release -o /app/build

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/build .

EXPOSE 5252

ENV ASPNETCORE_URLS=http://+:5252

ENTRYPOINT ["dotnet", "rtbackend.dll"]
