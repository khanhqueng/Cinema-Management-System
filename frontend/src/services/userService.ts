import api from "./api";

export const userService = {
  /**
   * Get current user's preferred genre names (score >= minScore)
   */
  async getMyGenrePreferences(minScore = 1): Promise<string[]> {
    const response = await api.get(
      `/preferences/genres/my-preferences/names?minScore=${minScore}`
    );
    return response.data;
  },

  /**
   * Replace all genre preferences with the provided list (score 4 = High)
   */
  async updateGenrePreferences(genres: string[]): Promise<void> {
    await api.post("/preferences/genres/initialize", {
      preferredGenres: genres,
    });
  },

  /**
   * Update current user's basic profile info (fullName, phone)
   */
  async updateProfile(data: {
    fullName: string;
    phone: string;
  }): Promise<any> {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
};
