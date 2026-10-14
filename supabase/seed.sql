-- DEV ONLY: a fake unclaimed device for testing with mosquitto_pub / MQTTX
-- (architecture guide, section 13). Never run this against production.
insert into devices (mac_address, pin_code)
values ('AABBCCDDEEFF', '123456')
on conflict (mac_address) do nothing;
