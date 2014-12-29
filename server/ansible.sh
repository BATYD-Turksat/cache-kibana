#!/bin/bash
echo "Ansible executer called with " $1
ansible-playbook -i /root/turksatlogsystem/ansible-cache-system/production /root/turksatlogsystem/ansible-cache-system/$1