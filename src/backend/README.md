# CV-Rank API

## API Endpoints

* `GET /health` - API health check
* `POST /cvs` - Upload CV in PDF format
* Swagger UI: `http://127.0.0.1:8000/docs`

## Configurations
Create `.env` file in project root with:

Optional variables:  
- Change maximum upload-file size in MB (Default is set to 5 MB, if not set).  
`MAX_UPLOAD_SIZE_MB`=2

- Change DB Server URL (Default is set to SQLite: sqlite:///storage/cv_rank.db).  
`DATABASE_URL`=sqlite:///storage/cv_rank.db

### Run

```bash
uv run main.py
```

API: `http://127.0.0.1:8000`
