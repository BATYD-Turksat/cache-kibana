README
===============
This folder should contain the symbolic links of the required yml files which will be exposed to user interface.

If any .yml file needs a meta file for UI customization or output formatting, generate the .meta file for it in Yaml format.

For example, "sample1.yml" can have "sample1.meta". Inside the meta file you can define meta-data like below.

    ---
    double_quotes:
      - 'cmd'
      - 'suricata_sniffing_interface'
      - 'suricata_sniffing_interface_type'