import math


class EmbeddingError(ValueError):
    """Raised when embedding vectors cannot be compared."""


def cosine_similarity(first: list[float], second: list[float]) -> float:
    if not first or not second or len(first) != len(second):
        raise EmbeddingError("Embedding vectors must have equal non-zero dimensions")

    first_norm = math.sqrt(sum(value * value for value in first))
    second_norm = math.sqrt(sum(value * value for value in second))
    if first_norm == 0 or second_norm == 0:
        return 0.0

    similarity = sum(a * b for a, b in zip(first, second)) / (first_norm * second_norm)
    return max(-1.0, min(1.0, similarity))
