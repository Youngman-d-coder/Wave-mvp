import os
import json
import subprocess

# --- PYTHON BACKEND SYNC LOGIC ---
def get_pip_freeze():
    """Runs 'pip freeze' and returns a dictionary of {package: version}."""
    # Look for venv inside a 'backend' folder or current directory
    pip_cmd = ["pip", "freeze"]
    if os.path.exists("backend/venv"):
        # Explicit path to backend venv executable on Windows
        pip_cmd = [os.path.join("backend", "venv", "Scripts", "pip"), "freeze"]
        
    try:
        result = subprocess.run(pip_cmd, capture_output=True, text=True, check=True)
        freeze_dict = {}
        for line in result.stdout.strip().split("\n"):
            if "==" in line:
                name, version = line.split("==")
                freeze_dict[name.strip()] = version.strip()
        return freeze_dict
    except Exception:
        return {}

def sync_backend():
    req_file = "backend/requirements.txt" if os.path.exists("backend") else "requirements.txt"
    current_env = get_pip_freeze()
    if not current_env:
        print("🐍 Python: No active virtual environment or pip packages found.")
        return

    existing_env = {}
    if os.path.exists(req_file):
        with open(req_file, "r") as f:
            for line in f:
                if "==" in line:
                    name, version = line.strip().split("==")
                    existing_env[name.strip()] = version.strip()

    added = [k for k in current_env if k not in existing_env]
    removed = [k for k in existing_env if k not in current_env]

    with open(req_file, "w") as f:
        f.write("# Generated automatically\n")
        for pkg, ver in sorted(current_env.items()):
            f.write(f"{pkg}=={ver}\n")

    print(f"🐍 Python Backend -> Syncing '{req_file}'")
    if added: print(f"  ➕ Added: {', '.join(added)}")
    if removed: print(f"  ❌ Removed: {', '.join(removed)}")
    if not added and not removed: print("  ✓ Already up to date.")

# --- FRONTEND NODE SYNC LOGIC ---
def find_package_json():
    """Locates the package.json file path dynamically."""
    if os.path.exists("package.json"):
        return "package.json"
    # Check common subfolder names like 'frontend' or your specific frontend folder
    for folder in ["frontend", "wave-mvp-v1.0-vite", "src"]:
        path = os.path.join(folder, "package.json")
        if os.path.exists(path):
            return path
    return None

def sync_frontend():
    pkg_path = find_package_json()
    if not pkg_path:
        print("📦 Frontend: No package.json detected in workspace.")
        return

    print(f"📦 Frontend JS/TS -> Auditing '{pkg_path}'")
    try:
        with open(pkg_path, "r") as f:
            data = json.load(f)
        
        # Combine dependencies and devDependencies to see the full list
        deps = data.get("dependencies", {})
        dev_deps = data.get("devDependencies", {})
        
        print(f"  ⚡ Core Apps ({len(deps)}): {', '.join(deps.keys()) if deps else 'None'}")
        print(f"  🛠️ Dev Tools ({len(dev_deps)}): {', '.join(dev_deps.keys()) if dev_deps else 'None'}")
        print("  ✓ State tracked and mapped.")
    except Exception as e:
        print(f"  ❌ Failed to parse package.json: {e}")

# --- MAIN EXECUTION CORNER ---
def main():
    print("=========================================")
    print("🚀 UNIFIED FULL-STACK DEPENDENCY MONITOR 🚀")
    print("=========================================\n")
    sync_backend()
    print("\n-----------------------------------------")
    sync_frontend()
    print("\n=========================================")

if __name__ == "__main__":
    main()