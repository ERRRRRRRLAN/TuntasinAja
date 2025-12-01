package com.tuntasinaja.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Status bar will be configured by StatusBarHandler component
        // Capacitor StatusBar plugin will handle the configuration
    }
}
