const AUTH_USER_PAGE_SIZE = 1_000;

export async function findAuthUserId(admin, email) {
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USER_PAGE_SIZE,
    });
    if (error) throw error;

    const match = data.users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail,
    );
    if (match) return match.id;
    if (data.users.length < AUTH_USER_PAGE_SIZE) return null;
  }
}
