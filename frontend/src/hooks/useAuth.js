import { isAuthenticated } from "../services/authService";

export default function useAuth() {
  return isAuthenticated();
}
