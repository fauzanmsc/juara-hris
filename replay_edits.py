import json

log_file = "/Users/c02gj1a9mlh/.gemini/antigravity-ide/brain/73596705-288e-4ec2-b5c3-caa8efc47989/.system_generated/logs/transcript.jsonl"
target_files = [
    "/Users/c02gj1a9mlh/Documents/JEF OFFICE/WEB-APPS/JEF HRIS/juara-hris/src/pages/employee/Attendance.tsx",
    "/Users/c02gj1a9mlh/Documents/JEF OFFICE/WEB-APPS/JEF HRIS/juara-hris/src/pages/employee/Leave.tsx",
    "/Users/c02gj1a9mlh/Documents/JEF OFFICE/WEB-APPS/JEF HRIS/juara-hris/src/pages/employee/History.tsx"
]

def load_arg(val):
    try:
        return json.loads(val)
    except:
        return val

def apply_edit(file_path, target_content, replacement_content):
    with open(file_path, 'r') as f:
        content = f.read()
    if target_content in content:
        content = content.replace(target_content, replacement_content)
        with open(file_path, 'w') as f:
            f.write(content)
        return True
    return False

with open(log_file, "r") as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get("step_index")
            if step >= 4443: # stop before git checkout
                break
            
            if data.get("type") == "PLANNER_RESPONSE" and "tool_calls" in data:
                for call in data["tool_calls"]:
                    name = call["name"]
                    args = call["args"]
                    
                    if name == "replace_file_content":
                        tf = load_arg(args.get("TargetFile", ""))
                        if tf in target_files:
                            target = load_arg(args.get("TargetContent", ""))
                            repl = load_arg(args.get("ReplacementContent", ""))
                            success = apply_edit(tf, target, repl)
                            print(f"Step {step} (replace) on {tf}: {'SUCCESS' if success else 'FAILED'}")
                            
                    elif name == "multi_replace_file_content":
                        tf = load_arg(args.get("TargetFile", ""))
                        if tf in target_files:
                            chunks = load_arg(args.get("ReplacementChunks", []))
                            if isinstance(chunks, str):
                                chunks = json.loads(chunks) # sometimes it's stringified twice
                            for chunk in chunks:
                                target = chunk.get("TargetContent", "")
                                repl = chunk.get("ReplacementContent", "")
                                success = apply_edit(tf, target, repl)
                                print(f"Step {step} (multi) on {tf}: {'SUCCESS' if success else 'FAILED'}")
        except Exception as e:
            pass

print("Done replaying edits.")
