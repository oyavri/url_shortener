import { PoolClient, PostgresError } from "https://deno.land/x/postgres@v0.19.3/mod.ts";
import { UserModel } from "../model/UserModel.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export async function registerUser(dbConnection: PoolClient, userCandidate: UserModel) {
  try {
    // having plain text password in the request is not a good practice
    // however, I'll keep it as is because the client is not
    // implemented yet.
    const hashedPassword = await bcrypt.hash(userCandidate.password);
  
    const createdUser = await dbConnection.queryObject<UserModel>({
      camelCase: true,
      text: "INSERT INTO user (username, email, password) VALUES ($username, $email, $password)",
      args: { 
        username: userCandidate.username, 
        email: userCandidate.email, 
        password: hashedPassword 
      }
    });

    return createdUser.rows[0];
  } catch (error) { 
      if (error instanceof PostgresError) {
        console.log("----------------------");
        console.error(error);
        console.log("----------------------");
      }

      throw error;
  }
}
