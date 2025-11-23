require 'json'

package = JSON.parse(File.read(File.join(__dir__, '../package.json')))

Pod::Spec.new do |s|
  s.name           = 'LoqaAudioDsp'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.swift_version  = '5.5'
  s.source         = { git: 'https://github.com/loqalabs/loqa-audio-dsp' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift and Objective-C source files (exclude Tests directory)
  s.source_files = "*.{h,m,mm,swift,hpp,cpp}", "RustFFI/**/*.{h,hpp,cpp}"
  s.exclude_files = "Tests/**/*"

  # Rust XCFramework (supports device + simulator)
  s.vendored_frameworks = "RustFFI/LoqaVoiceDSP.xcframework"
  s.preserve_paths = "RustFFI/LoqaVoiceDSP.xcframework"

  # Fallback: Static library (device only, for legacy support)
  # s.vendored_libraries = "RustFFI/libloqa_voice_dsp.a"
  # s.preserve_paths = "RustFFI/libloqa_voice_dsp.a"

  # Link required system frameworks and libraries
  s.frameworks = 'Foundation'
  s.libraries = 'c++', 'resolv'
end
