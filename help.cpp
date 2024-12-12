class Solution
{
public:
    vector<int> asteroidCollision(vector<int> &arr)
    {
        int n = arr.size();
        vector<int> ans;
        stack<int> st;
        for (int i = n - 1; i >= 0; i--)
        {
            bool flag = false;
            while (!st.empty() && arr[i] >= abs(st.top()))
            {
                if (abs(st.top()) == arr[i])
                {
                    st.pop();
                    continue;
                }
                st.pop();
            };
            if (arr[i] >= 0 && (st.empty() || arr[i] >= abs(st.top())))
            {
                ans.push_back(arr[i]);
            }
            else if (arr[i] < 0)
            {
                st.push(arr[i]);
            }
        }

        reverse(ans.begin(), ans.end());
        int c = 0;
        while (!st.empty())
        {
            ans.insert(ans.begin(), st.top());
            st.pop();
            c++;
        }
        reverse(ans.begin(), ans.begin() + c);
        return ans;
    }
};