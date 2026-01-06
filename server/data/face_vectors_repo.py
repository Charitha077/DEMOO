from extensions.mongo import db

face_vectors = db["face_vectors"]

def create_vector(vector_id, user_id, embedding, session=None):
    doc = {
        "_id": vector_id,
        "user_id": user_id,
        "embedding": embedding
    }
    return face_vectors.insert_one(doc, session=session)

def get_vector(vector_id):
    return face_vectors.find_one({"_id": vector_id})

def delete_vector(vector_id, session=None):
    return face_vectors.delete_one(
        {"_id": vector_id},
        session=session
    )

def search_similar_faces(query_vector, limit=5):
    pipeline = [
        {
            "$vectorSearch": {
                "index": "face_vector_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 200,
                "limit": limit
            }
        },
        {
            "$project": {
                "_id": 1,
                "user_id": 1,
                "score": {"$meta": "vectorSearchScore"}
            }
        }
    ]
    return list(face_vectors.aggregate(pipeline))
