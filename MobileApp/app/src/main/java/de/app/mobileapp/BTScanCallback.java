package de.app.mobileapp;

import android.bluetooth.BluetoothDevice;

public interface BTScanCallback {

    public void addDevice(BluetoothDevice device);
    public void updateDevice(BluetoothDevice device);

}
