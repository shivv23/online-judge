import oci
from oci.core.models import IngressSecurityRule, TcpOptions, PortRange

config = oci.config.from_file()
compute = oci.core.ComputeClient(config)
network = oci.core.VirtualNetworkClient(config)
identity = oci.identity.IdentityClient(config)

TARGET_IP = "129.225.105.207"

# Work out the compartment (default in config is tenancy root; list_vnic_attachments needs a compartment)
tenancy = config["tenancy"]
compartments = [c.data for c in identity.list_compartments(config["tenancy"], compartment_id_in_subtree=True).data
                if c.data.lifecycle_state == "ACTIVE"]

found = False
for comp in [tenancy] + [c.id for c in compartments]:
    for va in compute.list_vnic_attachments(compartment_id=comp).data:
        vnic = network.get_vnic(va.vnic_id).data
        if vnic.public_ip == TARGET_IP:
            found = True
            subnet_id = vnic.subnet_id
            print(f"Found VNIC {vnic.display_name} on subnet {subnet_id}")

            subnet = network.get_subnet(subnet_id).data
            print(f"Subnet: {subnet.display_name}, VCN: {subnet.vcn_id}")

            sec_lists = network.list_security_lists(compartment_id=comp, vcn_id=subnet.vcn_id).data
            if subnet.security_list_ids:
                sec_lists = [sl for sl in sec_lists if sl.id in subnet.security_list_ids]

            for sl in sec_lists:
                existing = {f"{r.protocol}:{r.tcp_options.destination_port_range.min if r.tcp_options and r.tcp_options.destination_port_range else '-':}" for r in sl.ingress_security_rules}
                print(f"\nSecurity List: {sl.display_name} ({sl.id})")
                print("  Current ingress rules:")
                for r in sl.ingress_security_rules:
                    proto = r.protocol  # '6' = TCP
                    src = r.source
                    ports = r.tcp_options.destination_port_range if r.tcp_options else None
                    ports_txt = f"{ports.min}-{ports.max}" if ports and ports.max != ports.min else (str(ports.min) if ports else "all")
                    print(f"    {r.description or ''} proto={proto} src={src} dport={ports_txt}")

                new_rules = []
                for port in (80, 443):
                    if not any(
                        r.protocol == "6"
                        and r.source == "0.0.0.0/0"
                        and r.tcp_options
                        and r.tcp_options.destination_port_range
                        and r.tcp_options.destination_port_range.min == port
                        and r.tcp_options.destination_port_range.max == port
                        for r in sl.ingress_security_rules
                    ):
                        new_rules.append(
                            IngressSecurityRule(
                                protocol="6",
                                source="0.0.0.0/0",
                                description=f"Open TCP {port} for web",
                                tcp_options=TcpOptions(destination_port_range=PortRange(min=port, max=port)),
                            )
                        )

                if new_rules:
                    merged = list(sl.ingress_security_rules) + new_rules
                    network.update_security_list(
                        sl.id,
                        oci.core.models.UpdateSecurityListDetails(ingress_security_rules=merged),
                        if_match=sl.etag,
                    )
                    print(f"  -> Added: {[r.tcp_options.destination_port_range.min for r in new_rules]}")
                else:
                    print("  -> No changes needed")
            break
    if found:
        break

if not found:
    print(f"Could not find VNIC with public IP {TARGET_IP}")