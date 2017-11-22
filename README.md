
         rtm2workflowy
         =============


This script is intended to export selected [Remember The Milk](http://www.rememberthemilk.com) lists
into your [Workflowy](http://www.workflowy.com).  I have used RTM for years and remain throughly 
satisified with it.  However, I have found that my Someday/Maybe lists tend to stagnate
and become inactionable.  I recently found Workflowy and I want to migrate selectively some items over there.

This work primarily depends on the  [dwaring87/rtm-api](https://github.com/dwaring87/rtm-api) and [opusfluxus](https://github.com/mike4263/opusfluxus)  APIs for RTM and WF respectively.  Props to the original authors for the heavy lifting.

This script will migrate selected lists into Workflowy.

```
  usage: rtm2wf [RTM-LIST-ID] [WF-PARENT-ID] [--include-tags] [--mark-complete]

```

Implementation Notes:
* The URL will be added as the first line of the description
* The notes will be below the URL (if any) and
* Reminders, dates, repeating info will all be discared
* Tags will be migrated as WF tags if the `--include-tags` is specified
* This is intended to be a one-way sync from RTM to WF.  WF's lack of normalization or a proper API seriously prohibit an generalized WF -> RTM migration tool (and that doesn't fit my workflow anyway)

