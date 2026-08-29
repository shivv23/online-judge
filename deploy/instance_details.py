import oci

config = oci.config.from_file()
compute = oci.core.ComputeClient(config)
network = oci.core.VirtualNetworkClient(config)

# Get instance details
instance_id = "ocid1.instance.oc1.ap-hyderabad-1.anuhsljriufottqcoqwl5uaqkn6yri77f4u7sixslc27y24mrxfhg5sdqhva"
inst = compute.get_instance(instance_id)
print(f"Name: {inst.data.display_name}")
print(f"State: {inst.data.lifecycle_state}")
print(f"Shape: {inst.data.shape}")
print(f"OCPU: {inst.data.shape_config.ocpus}")
print(f"RAM: {inst.data.shape_config.memory_in_gbs} GB")
print(f"Compartment: {inst.data.compartment_id}")

# Get VNIC attachments
vnic_attachments = compute.list_vnic_attachments(compartment_id=inst.data.compartment_id, instance_id=instance_id)
for va in vnic_attachments.data:
    vnic = network.get_vnic(va.vnic_id)
    print(f"\nVNIC: {vnic.data.display_name}")
    print(f"  Public IP: {vnic.data.public_ip}")
    print(f"  Private IP: {vnic.data.private_ip}")
    print(f"  Subnet: {vnic.data.subnet_id}")
