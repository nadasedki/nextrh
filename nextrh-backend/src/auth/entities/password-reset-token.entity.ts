import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('password_reset_tokens')
export class PasswordResetToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index() // Speeds up token validation lookups
  token_hash: string;

  @Column()
  user_id: number;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  used: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}