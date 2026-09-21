require 'json'
require 'fileutils'

def get_cache_path
  home = Dir.home
  platform = RUBY_PLATFORM.downcase

  if platform.include?('darwin')
    File.join(home, 'Library', 'Caches', 'Microsoft Edge')
  elsif platform.include?('linux')
    File.join(home, '.cache', 'microsoft-edge')
  elsif platform.include?('mingw') || platform.include?('mswin') || platform.include?('cygwin')
    local_app_data = ENV['LOCALAPPDATA'] || File.join(home, 'AppData', 'Local')
    File.join(local_app_data, 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache')
  else
    nil
  end
end

def estimate_size(path)
  total = 0
  if Dir.exist?(path)
    Dir.glob(File.join(path, '**', '*')).each do |f|
      begin
        total += File.size(f) if File.file?(f)
      rescue StandardError
        # Ignore files we cannot access
      end
    end
  end
  total
end

begin
  if ARGV.empty?
    puts JSON.generate({ reclaimed_bytes: 0, error: "Unknown command" })
    exit
  end

  command = ARGV[0]
  cache_path = get_cache_path

  if cache_path.nil?
    puts JSON.generate({ reclaimed_bytes: 0, error: "Unsupported OS" })
    exit
  end

  case command
  when "installed"
    installed = Dir.exist?(cache_path)
    puts JSON.generate({ installed: installed })
  when "estimate"
    size = estimate_size(cache_path)
    puts JSON.generate({ reclaimed_bytes: size, error: "" })
  when "clean"
    size = estimate_size(cache_path)
    FileUtils.rm_rf(cache_path) if Dir.exist?(cache_path)
    puts JSON.generate({ reclaimed_bytes: size, error: "" })
  else
    puts JSON.generate({ reclaimed_bytes: 0, error: "Unknown command" })
  end

rescue StandardError => e
  puts JSON.generate({ reclaimed_bytes: 0, error: e.message })
end
