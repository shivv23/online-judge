import oci
import json

config = oci.config.from_file()
compute = oci.core.ComputeClient(config)

instance_id = "ocid1.instance.oc1.ap-hyderabad-1.anuhsljriufottqcoqwl5uaqkn6yri77f4u7sixslc27y24mrxfhg5sdqhva"

# Read all our public keys
keys_to_add = []
for keyfile in [r"C:\Users\HP\.ssh\oci_ed25519.pub", r"C:\Users\HP\.ssh\oci_vm_key.pub", r"C:\Users\HP\.ssh\oci_ssh2.pub"]:
    try:
        with open(keyfile, "r") as f:
            keys_to_add.append(f.read().strip())
    except:
        pass

# Get current instance metadata
inst = compute.get_instance(instance_id)
current_metadata = inst.data.metadata or {}
current_ssh = current_metadata.get("ssh_authorized_keys", "")
print("Current keys:")
print(current_ssh)
print()

# Build new key set
existing_keys = [k.strip() for k in current_ssh.split("\n") if k.strip()] if current_ssh else []
all_keys = list(existing_keys)
for k in keys_to_add:
    if k not in all_keys:
        all_keys.append(k)

new_ssh = "\n".join(all_keys)
print("New keys:")
print(new_ssh)
print()

# Update metadata (must include ALL metadata fields)
new_metadata = dict(current_metadata)
new_metadata["ssh_authorized_keys"] = new_ssh

update_details = oci.core.models.UpdateInstanceDetails(metadata=new_metadata)
result = compute.update_instance(instance_id, update_details)
print(f"Updated! State: {result.data.lifecycle_state}")
