import { useParams } from "react-router-dom";

import CreateUser from "./CreateUser";
import UpdateUser from "./UpdateUser";
import GetUser from "./GetUser";
import DeleteUser from "./DeleteUser";
import GetRequests from "./GetRequests";
import ChangePassword from "./ChangePassword";
import PromoteStudents from "./PromoteStudents";

export default function UserOperationRouter() {
  const { action } = useParams();

  switch (action) {
    case "create":
      return <CreateUser />;

    case "update":
      return <UpdateUser />;

    case "get":
      return <GetUser />;

    case "delete":
      return <DeleteUser />;

    case "requests":
      return <GetRequests />;

    case "password":
      return <ChangePassword />;

    case "promote":
      return <PromoteStudents />;
    default:
      return <div className="p-10">Invalid action</div>;
  }
}