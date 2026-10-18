-- One reading per device per timestamp. Lets Go's INSERT ... ON CONFLICT DO NOTHING
-- drop duplicates when the broker redelivers a QoS 1 message.
alter table telemetry
  add constraint telemetry_device_ts_key unique (device_id, "timestamp");
