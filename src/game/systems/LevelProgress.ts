export class LevelProgress {
  private readonly remainingRequiredMeetings: Set<string>;
  private completed = false;

  constructor(requiredMeetingIds: readonly string[]) {
    this.remainingRequiredMeetings = new Set(requiredMeetingIds);

    if (this.remainingRequiredMeetings.size === 0) {
      throw new Error('A level must contain at least one required meeting');
    }
  }

  registerDestroyed(meetingId: string, required: boolean): boolean {
    if (this.completed || !required) {
      return false;
    }

    this.remainingRequiredMeetings.delete(meetingId);

    if (this.remainingRequiredMeetings.size === 0) {
      this.completed = true;
      return true;
    }

    return false;
  }

  get remainingRequired(): number {
    return this.remainingRequiredMeetings.size;
  }
}
