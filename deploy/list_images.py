import oci

config = oci.config.from_file()
compute = oci.core.ComputeClient(config)
identity = oci.identity.IdentityClient(config)
compartment_id = config["tenancy"]

# List all ADs
ads = identity.list_availability_domains(compartment_id)
print("Availability Domains:")
for ad in ads.data:
    print(f"  {ad.name}")

# List all images
all_imgs = compute.list_images(compartment_id, sort_by="TIMECREATED", sort_order="DESC")
print("\nAll available images:")
for img in all_imgs.data:
    name = (img.display_name or "")
    os = (img.operating_system or "")
    ver = (img.operating_system_version or "")
    if "ubuntu" in name.lower() or "ubuntu" in os.lower():
        print(f"  {name} | {os} {ver} | {img.id}")
