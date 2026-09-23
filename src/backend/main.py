import uvicorn


def main():
    print("Starting Cv-Rank API...!")
    uvicorn.run(
        "app.app:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()
