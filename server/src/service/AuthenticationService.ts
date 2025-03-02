import { PoolClient, PostgresError } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { UserModel } from "../model/UserModel.ts";
import { UserAlreadyExistsError } from "../model/UserAlreadyExistsError.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { UserNotFoundError } from "../model/UserNotFoundError.ts";

export async function registerUser(dbConnection: PoolClient, userCandidate: UserModel) {
  try {
    const hashedPassword = await bcrypt.hash(userCandidate.password);
  
    const createdUser = await dbConnection.queryObject<UserModel>({
      camelCase: true,
      text: "INSERT INTO users (username, email, password) VALUES ($username, $email, $password);",
      args: { 
        username: userCandidate.username, 
        email: userCandidate.email, 
        password: hashedPassword
      }
    });

    console.log(createdUser);

    return createdUser.rows[0];
  } catch (error) { 
      if (error instanceof PostgresError && error.fields.code == "23505") {
        throw new UserAlreadyExistsError("User already exists");
      }

      throw error;
  }
}

export async function loginUser(dbConnection: PoolClient, username: string, password: string): Promise<UserModel> {
  try {
    const userCandidate = await dbConnection.queryObject<UserModel>({
      camelCase: true,
      text: "SELECT * FROM users WHERE username = $username",
      args: {
        username: username
      }
    });

    if (userCandidate.rows[0] === undefined) {
      throw new UserNotFoundError("User does not exist or provided credentials are wrong");
    }

    const isValid = await bcrypt.compare(password, userCandidate.rows[0].password);

    if (!isValid) {
      throw new UserNotFoundError("User does not exist or provided credentials are wrong");
    }
    
    console.log(userCandidate);
    
    return userCandidate.rows[0];
  } catch (error) {
    throw error;
  }
}
