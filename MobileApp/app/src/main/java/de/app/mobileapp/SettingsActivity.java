package de.app.mobileapp;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.widget.NestedScrollView;

import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothProfile;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Switch;
import android.widget.TextView;

import org.w3c.dom.Text;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;


public class SettingsActivity extends AppCompatActivity implements Style{

    Map<String, TextView> map_devices;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        GlobalData.currentContext = this;
        map_devices = new HashMap<>();

        //
        findViewById(R.id.layout_base).setBackgroundColor(COLOR_DARK_1);
        //findViewById(R.id.view_devices).setBackgroundColor(COLOR_DARK_2);
        //findViewById(R.id.tv_log).setBackgroundColor(COLOR_DARK_2);

        TextView tv = findViewById(R.id.tv_rot_threshold);
        //tv.setBackgroundColor(COLOR_DARK_2);
        tv.setTextColor(COLOR_WHITE);

        EditText et = findViewById(R.id.number_rot_threshold);
        et.setText(""+GlobalData.ROTATION_DELTA_THRESHOLD);
        //et.setBackgroundColor(COLOR_DARK_2);
        et.setTextColor(COLOR_WHITE);
        et.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                try{
                    GlobalData.ROTATION_DELTA_THRESHOLD = Integer.parseInt(s.toString());
                } catch (Exception e){

                }
            }
        });
        //


        Switch sw = findViewById(R.id.switch_generate_values);
        //sw.setBackgroundColor(COLOR_DARK_2);
        sw.setTextColor(COLOR_WHITE);
        sw.setChecked(GlobalData.generateFakeSensorValues);
        sw.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                GlobalData.generateFakeSensorValues = isChecked;
            }
        });

        sw = findViewById(R.id.switch_show_graph);
        //sw.setBackgroundColor(COLOR_DARK_2);
        sw.setTextColor(COLOR_WHITE);
        sw.setChecked(GlobalData.showFullGraph);
        sw.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                GlobalData.showFullGraph = isChecked;
            }
        });

        sw = findViewById(R.id.switch_pause_data_collection);
        //sw.setBackgroundColor(COLOR_DARK_2);
        sw.setTextColor(COLOR_WHITE);
        sw.setChecked(GlobalData.pauseDataCollection);
        sw.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                GlobalData.pauseDataCollection = isChecked;
            }
        });


        GlobalData.scanBTDevices(new BTScanCallback() {
            @Override
            public void addDevice(BluetoothDevice device) {
                SettingsActivity.this.addDevice(device);
            }

            @Override
            public void updateDevice(BluetoothDevice device) {
                if(map_devices.containsKey(device))
                    map_devices.get(device).setText(device.getName()+" "+device.getAddress());
            }
        });

        Button btn_calibrate = findViewById(R.id.btn_calibrate);
        btn_calibrate.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                //GlobalData.totalAcceleration += GlobalData.ACC_TOTAL_CALIBRATION_OFFSET;
                //GlobalData.ACC_TOTAL_CALIBRATION_OFFSET = GlobalData.totalAcceleration;
                //GlobalData.totalAcceleration -= GlobalData.ACC_TOTAL_CALIBRATION_OFFSET;

                GlobalData.GYR_OFFSET_X = -(GlobalData.ROTS_X - GlobalData.GYR_OFFSET_X);
                GlobalData.GYR_OFFSET_Y = -(GlobalData.ROTS_Y - GlobalData.GYR_OFFSET_Y);
                GlobalData.GYR_OFFSET_Z = -(GlobalData.ROTS_Z - GlobalData.GYR_OFFSET_Z);

                GlobalData.rotationsSinceLaunch = 0;
                GlobalData.ROT_T0 = System.currentTimeMillis();

                GlobalData.ROT_X = 0;
                GlobalData.ROT_Y = 0;
                GlobalData.ROT_Z = 0;

                try{
                    Runtime.getRuntime().exec(new String[]{"logcat", "-c"});
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        });


        GlobalData.readLogcat(this);
    }

    private void addDevice(final BluetoothDevice device){
        LinearLayout layout_scroll = findViewById(R.id.layout_scroll_view);

        TextView vt = map_devices.containsKey(device.getAddress()) ? map_devices.get(device.getAddress()) : new TextView(this);
        vt.setTextColor(COLOR_WHITE);
        vt.setText(device.getName()+" "+device.getAddress());
        vt.setGravity(Gravity.CENTER);
        vt.setBackground(getResources().getDrawable(GlobalData.bluetoothGatt!=null && device.getAddress().equals(GlobalData.bluetoothGatt.getDevice().getAddress()) ? R.drawable.stroke_connected : R.drawable.stroke));
        //vt.setTextSize(16);
        vt.setHeight((int)(32f * getResources().getDisplayMetrics().density));

        vt.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                //GlobalData.Log("Connecting to "+device.getName());
                GlobalData.stopScan();

                vt.setBackground(getResources().getDrawable(R.drawable.stroke_light));

                GlobalData.bluetoothGatt = device.connectGatt(SettingsActivity.this, false, new BluetoothGattCallback() {
                    @Override
                    public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
                        //GlobalData.Log("ConSC: "+status+" "+newState);
                        if(newState == BluetoothProfile.STATE_CONNECTED){
                            GlobalData.Log("Connected to "+device.getName());
                            GlobalData.connection_status = GlobalData.CONNECTION_STATUS_CONNECTED;

                            vt.setBackground(getResources().getDrawable(R.drawable.stroke_connected));

                            gatt.discoverServices();
                        }
                        else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                            GlobalData.Log("Disconnected from "+device.getName());

                            GlobalData.connection_status = GlobalData.CONNECTION_STATUS_OFFLINE;

                            vt.setBackground(getResources().getDrawable(R.drawable.stroke));
                            GlobalData.bluetoothGatt = null;
                        }
                    }

                    @Override
                    public void onServicesDiscovered(BluetoothGatt gatt, int status) {
                        if(status == BluetoothGatt.GATT_SUCCESS){
                            //GlobalData.Log("Discovered Gatt services");

                            for(BluetoothGattService service : gatt.getServices()){
                                //GlobalData.Log("Service: "+service.getUuid().toString());
                                for(BluetoothGattCharacteristic c : service.getCharacteristics()){
                                    //GlobalData.Log("SV CH: "+c.getUuid().toString());

                                    //
                                    if(c.getUuid().toString().startsWith(GlobalData.BLE_SV_CR_VOLTAGE.toLowerCase())){//Found Bat Voltage
                                        //GlobalData.Log("Found voltage service");

                                        GlobalData.cr_voltage = c;
                                        GlobalData.bluetoothGatt.setCharacteristicNotification(c, true);
                                    }
                                    else if(c.getUuid().toString().startsWith(GlobalData.BLE_SV_CR_ACCELEROMETER.toLowerCase())) {//Found ACC Read
                                        //GlobalData.Log("Found accelerometer service");

                                        GlobalData.cr_accelerometer = c;
                                        GlobalData.bluetoothGatt.setCharacteristicNotification(c, true);

                                        //GlobalData.readIMU();
                                    }
                                    else if(c.getUuid().toString().startsWith(GlobalData.BLE_SV_CR_ACCELEROMETER_TOGGLE.toLowerCase())) {//Found ACC Toggle
                                        //GlobalData.Log("Found IMU toggle service");

                                        GlobalData.cr_accelerometer_toggle = c;
                                    }
                                    else if(c.getUuid().toString().startsWith(GlobalData.BLE_SV_CR_ACCELEROMETER_CALIBRATION.toLowerCase())) {//Found ACC Calibration
                                        //GlobalData.Log("Found IMU calibration service");

                                        GlobalData.cr_accelerometer_calibration = c;
                                    }
                                    else if(c.getUuid().toString().startsWith(GlobalData.BLE_SV_CR_ACCELEROMETER_SETTINGS.toLowerCase())) {//Found ACC Settings
                                        //GlobalData.Log("Found IMU settings");

                                        GlobalData.cr_accelerometer_settings = c;
                                    }
                                    //
                                }
                                GlobalData.startIMU();
                            }
                        }
                        else{
                            GlobalData.Log("Error discovering services: "+status);
                        }
                    }

                    
                    @Override
                    public void onCharacteristicRead(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
                        if(characteristic==GlobalData.cr_voltage){
                            byte[] data = characteristic.getValue();

                            float voltage = (float)((data[3] * 256.0 + data[4]) * 0.001);

                            GlobalData.setBattery_voltage(voltage);
                            GlobalData.battery_charging = data[5] == 1 ? true : false;

                            if(!GlobalData.forceStop){
                                GlobalData.readBatteryVoltage();
                            }
                            //GlobalData.Log("Reading Voltage: " + voltage);
                        }
                        else if(characteristic==GlobalData.cr_accelerometer_calibration){
                            byte[] data = characteristic.getValue();

                            GlobalData.ACC_OFFSET_X = GlobalData.toShort(data[9], data[10]);
                            GlobalData.ACC_OFFSET_Y = GlobalData.toShort(data[11], data[12]);
                            GlobalData.ACC_OFFSET_Z = GlobalData.toShort(data[13], data[14]);

                            //GlobalData.GYR_OFFSET_X = GlobalData.toShort(data[3], data[4]);
                            //GlobalData.GYR_OFFSET_Y = GlobalData.toShort(data[5], data[6]);
                            //GlobalData.GYR_OFFSET_Z = GlobalData.toShort(data[7], data[8]);

                            //GlobalData.Log("Read Calibration:" +Arrays.toString(data));

                            GlobalData.readBatteryVoltage();
                        }
                    }

                    @Override
                    public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
                        if(characteristic == GlobalData.cr_accelerometer){
                            byte[] data = characteristic.getValue();

                            float sf = 4096.0f;
                            float ax = (float)(GlobalData.toShort(data[9], data[10]) + GlobalData.ACC_OFFSET_X * 2) / sf * 9.80665f;
                            float ay = (float)(GlobalData.toShort(data[11], data[12]) + GlobalData.ACC_OFFSET_Y * 2) / sf * 9.80665f;
                            float az = (float)(GlobalData.toShort(data[13], data[14]) + GlobalData.ACC_OFFSET_Z * 2) / sf * 9.80665f;

                            //GlobalData.totalAcceleration = ((GlobalData.totalAcceleration + GlobalData.ACC_TOTAL_CALIBRATION_OFFSET) * 0.95f + 0.05f * (float)Math.sqrt(ax*ax+ay*ay+az*az)) - GlobalData.ACC_TOTAL_CALIBRATION_OFFSET;//smooth out data

                            //gyro
                            sf = 32.8f;
                            float rxs = (float)(GlobalData.toShort(data[3], data[4])) / sf + GlobalData.GYR_OFFSET_X;
                            float rys = (float)(GlobalData.toShort(data[5], data[6])) / sf + GlobalData.GYR_OFFSET_Y;
                            float rzs = (float)(GlobalData.toShort(data[7], data[8])) / sf + GlobalData.GYR_OFFSET_Z;

                            GlobalData.updateRotationSpeed(rxs, rys, rzs);

                            //((TextView)findViewById(R.id.tv_log)).setText(Arrays.toString(data));
                            ((TextView)findViewById(R.id.tv_log)).setText("[" + ax+", "+ay+", "+az+"]" + "\n [" + rxs+", "+rys+", "+rzs+"]");

                            //GlobalData.Log("Reading IMU Data:" +data.length);
                        }
                    }

                    @Override
                    public void onCharacteristicWrite(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic, int status) {
                        if(characteristic == GlobalData.cr_accelerometer_toggle){
                            //GlobalData.Log("Written Toggle:" +Arrays.toString(characteristic.getValue()));

                            GlobalData.writeSettings();
                        }
                        else if(characteristic == GlobalData.cr_accelerometer_settings){
                            //GlobalData.Log("Written Settings:" +Arrays.toString(characteristic.getValue()));

                            GlobalData.readIMUCalibration();
                        }
                    }
                }, BluetoothDevice.TRANSPORT_LE);

                if(GlobalData.bluetoothGatt==null){
                    GlobalData.Log("GATT could not be initialized");
                }


            }
        });

        layout_scroll.addView(vt);

        map_devices.put(device.getAddress(), vt);
    }
}
