import oci

config = oci.config.from_file()
compute = oci.core.ComputeClient(config)

# List all instances in the tenancy
instances = compute.list_instances(config["tenancy"])
for inst in instances.data:
    print(f"ID: {inst.id}")
    print(f"  Name: {inst.display_name}")
    print(f"  State: {inst.state}")
    print(f"  Shape: {inst.shape}")
    print(f"  Compartment: {inst.compartment_id}")
    print()
