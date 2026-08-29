import oci
import time

config = oci.config.from_file()
compute = oci.core.ComputeClient(config)
network = oci.core.VirtualNetworkClient(config)

compartment_id = config["tenancy"]

# 1. Get image - use the one that worked before
image_id = "ocid1.image.oc1.ap-hyderabad-1.aaaaaaaastbujofyahj3xkz6rqu23r64afcs2k7ysawrprb7za6crqbzexsq"
print(f"Using image: {image_id}")

# 2. Get network from superapp-prod
old_id = "ocid1.instance.oc1.ap-hyderabad-1.anuhsljriufottqcoqwl5uaqkn6yri77f4u7sixslc27y24mrxfhg5sdqhva"
old_inst = compute.get_instance(old_id)
old_vnic_atts = compute.list_vnic_attachments(compartment_id=compartment_id, instance_id=old_id)
old_vnic = network.get_vnic(old_vnic_atts.data[0].vnic_id)
subnet_id = old_vnic.data.subnet_id
ad = old_inst.data.availability_domain

# 3. SSH key
with open(r"C:\Users\HP\.ssh\oci_ed25519.pub", "r") as f:
    ssh_key = f.read().strip()

# 4. Try shapes in order: E4.Flex 2/8 -> E4.Flex 1/4 -> E2.1.Micro (free)
shapes_to_try = [
    ("VM.Standard.E4.Flex", oci.core.models.LaunchInstanceShapeConfigDetails(ocpus=2, memory_in_gbs=8)),
    ("VM.Standard.E4.Flex", oci.core.models.LaunchInstanceShapeConfigDetails(ocpus=1, memory_in_gbs=4)),
    ("VM.Standard.E2.1.Micro", None),
]

instance_id = None
for shape, shape_config in shapes_to_try:
    label = f"{shape}" + (f" {shape_config.ocpus}OCPU/{shape_config.memory_in_gbs}GB" if shape_config else " (free)")
    print(f"\nTrying {label}...")
    
    kwargs = dict(
        compartment_id=compartment_id,
        display_name="online-judge-prod",
        shape=shape,
        source_details=oci.core.models.InstanceSourceViaImageDetails(
            source_type="image",
            image_id=image_id
        ),
        create_vnic_details=oci.core.models.CreateVnicDetails(
            subnet_id=subnet_id,
            assign_public_ip=True,
            display_name="online-judge-vnic"
        ),
        metadata={"ssh_authorized_keys": ssh_key},
        availability_domain=ad,
    )
    if shape_config:
        kwargs["shape_config"] = shape_config
    
    try:
        result = compute.launch_instance(oci.core.models.LaunchInstanceDetails(**kwargs))
        instance_id = result.data.id
        print(f"  Success! ID: {instance_id}")
        break
    except oci.exceptions.ServiceError as e:
        print(f"  Failed: {e.message}")

if not instance_id:
    print("\nAll shapes failed. Region may be at capacity.")
    raise SystemExit(1)

# 5. Wait for RUNNING
print("\nWaiting for instance to provision...")
while True:
    inst = compute.get_instance(instance_id)
    state = inst.data.lifecycle_state
    print(f"  State: {state}")
    if state == "RUNNING":
        break
    if state in ("TERMINATED", "FAULTY"):
        print("Instance failed!")
        raise SystemExit(1)
    time.sleep(15)

# 6. Get public IP
time.sleep(5)
vnic_atts = compute.list_vnic_attachments(compartment_id=compartment_id, instance_id=instance_id)
vnic = network.get_vnic(vnic_atts.data[0].vnic_id)
public_ip = vnic.data.public_ip
shape = inst.data.shape
print(f"\n  Shape: {shape}")
print(f"  Public IP: {public_ip}")
print(f"  SSH: ssh -i C:\\Users\\HP\\.ssh\\oci_ed25519 ubuntu@{public_ip}")

with open(r"D:\DevSeason\online-judge\deploy\instance_info.txt", "w") as f:
    f.write(f"INSTANCE_ID={instance_id}\n")
    f.write(f"PUBLIC_IP={public_ip}\n")
    f.write(f"SHAPE={shape}\n")
    f.write(f"SSH_KEY=C:\\Users\\HP\\.ssh\\oci_ed25519\n")
    f.write(f"USER=ubuntu\n")
print("\nInstance info saved to deploy/instance_info.txt")
