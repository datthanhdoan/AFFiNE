package app.affine.pro

import android.os.Build
import android.os.Bundle
import androidx.annotation.RequiresApi
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    @RequiresApi(Build.VERSION_CODES.R)
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
    }
}
