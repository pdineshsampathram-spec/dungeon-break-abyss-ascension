// =====================================================================
//  DUNGEON BREAK — js/cinematics/CinematicTimeline.js
//  Reusable timeline runner for scriptable cinematic cutscenes
// =====================================================================

export class CinematicTimeline {
  constructor(steps = []) {
    this.steps = steps;
    this.currentStep = 0;
    this.timer = 0;
    this.completed = false;
  }

  tick(dt) {
    if (this.completed || this.currentStep >= this.steps.length) {
      this.completed = true;
      return;
    }

    const step = this.steps[this.currentStep];
    this.timer += dt;

    if (step.onUpdate) step.onUpdate(dt, this.timer);

    if (this.timer >= (step.duration || 1.0)) {
      if (step.onComplete) step.onComplete();
      this.currentStep++;
      this.timer = 0;
      if (this.currentStep < this.steps.length && this.steps[this.currentStep].onStart) {
        this.steps[this.currentStep].onStart();
      }
    }
  }
}
