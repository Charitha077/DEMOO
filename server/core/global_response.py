from starlette.status import HTTP_200_OK

def success(message: str, data=None, status_code=HTTP_200_OK):
    return {
        "success": True,
        "statusCode": status_code,
        "message": message,
        "data": data
    }


def error(message: str, status_code: int, detail=None):
    resp = {
        "success": False,
        "statusCode": status_code,
        "message": message
    }
    if detail:
        resp["detail"] = detail
    return resp
