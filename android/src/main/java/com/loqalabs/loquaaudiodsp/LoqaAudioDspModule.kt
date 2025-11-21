package com.loqalabs.loquaaudiodsp

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class LoqaAudioDspModule : Module() {
  // Module definition for Expo Modules API
  override fun definition() = ModuleDefinition {
    // Module name that JavaScript will use to require this module
    Name("LoqaAudioDsp")

    // Placeholder functions - will be implemented in subsequent stories
    // Story 2.3 will implement Android FFT binding
    // Story 3.3 will implement Android pitch and formants bindings
    // Story 4.2 will implement Android spectrum analysis binding
  }
}
