// server/services/userService.ts
import { User } from '../models/User'; // Adjust import to your ORM/model

export class UserService {
  async getAllUsers() {
    // Example: fetch users from DB
    return await User.findAll();
  }
}
