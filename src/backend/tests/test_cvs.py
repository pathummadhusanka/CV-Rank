from pathlib import Path


def test_upload_rejects_non_pdf_files(client):
    response = client.post(
        "/cvs",
        files={"file": ("resume.txt", b"not a PDF", "text/plain")},
    )

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Only PDF files are currently supported!"
    }


def test_upload_processes_pdf_and_persists_cv(client, monkeypatch, tmp_path):
    from app.routes import cvs

    upload_dir = tmp_path / "cvs"
    upload_dir.mkdir()
    monkeypatch.setattr(cvs, "UPLOAD_DIR", upload_dir)
    pdf_path = Path("tests/fixtures/cvs/candidate_001_alex_perera.pdf")

    with pdf_path.open("rb") as pdf_file:
        response = client.post(
            "/cvs",
            files={"file": (pdf_path.name, pdf_file, "application/pdf")},
        )

    assert response.status_code == 200
    result = response.json()
    assert result["filename"] == pdf_path.name
    assert result["status"] == "processed"
    assert upload_dir.joinpath(f"{result['id']}.pdf").exists()
