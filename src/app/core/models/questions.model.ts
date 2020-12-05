import { User } from './user.model';


export interface Questions{

  id :string;
  question :string; 
  answer:string;
  answerAt:Date;
  createdAt: Date,
  createdBy: User,
}