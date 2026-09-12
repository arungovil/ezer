export interface UserResponseBody {
  id: string;
  createdAt: string;
}

export function toUserResponseBody(user: { id: string; createdAt: string }): UserResponseBody {
  return {
    id: user.id,
    createdAt: user.createdAt,
  };
}
