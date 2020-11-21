import { User } from './user.model';

export interface Push {
  id: string;
  sendingUser: User;
  recipientUser: User;
  message: string;
  title: string;
  read: boolean;      //If it was read, true. If it was not, false.
}