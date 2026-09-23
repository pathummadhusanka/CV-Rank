# CV-Rank API

## API Endpoints

* `GET /health` - API health check
* Swagger UI: `http://127.0.0.1:8000/docs`

## Configurations
Create `.env` file in project root with:

Optional variables:  
- Change maximum upload-file size in MB (Default is set to 5 MB, if not set).  
`MAX_UPLOAD_SIZE_MB`=2

### Run

```bash
uv run main.py
```

API: `http://127.0.0.1:8000`
